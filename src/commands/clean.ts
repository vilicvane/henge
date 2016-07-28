import {
    Command,
    command,
    metadata
} from 'clime';

@command({
    description: 'Clean the previous distribution of a project.'
})
export default class extends Command {
    @metadata
    async execute() {
        console.log('Clean~');
    }
}
